import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 60

// Function to sanitize strings by replacing problematic Unicode characters
function sanitizeString(str: string): string {
  return str
    // Replace specific problematic character (9650 = ▲)
    .replace(/\u25b2/g, '[up-triangle]') // ▲
    .replace(/\u25bc/g, '[down-triangle]') // ▼
    .replace(/\u25c6/g, '[diamond]') // ◆
    .replace(/\u2605/g, '[star]') // ★
    .replace(/\u26a1/g, '[bolt]') // ⚡
    // Replace common emoji and symbols with text equivalents
    .replace(/💬/g, '[chat]')
    .replace(/🔥/g, '[fire]')
    .replace(/🚀/g, '[rocket]')
    // Replace ranges that might cause issues
    .replace(/[\u2600-\u26FF]/g, '[symbol]') // Miscellaneous symbols
    .replace(/[\u2700-\u27BF]/g, '[symbol]') // Dingbats
    .replace(/[\u1F600-\u1F64F]/g, '[emoji]') // Emoticons
    .replace(/[\u1F300-\u1F5FF]/g, '[emoji]') // Misc symbols and pictographs
    .replace(/[\u1F680-\u1F6FF]/g, '[emoji]') // Transport and map symbols
    .replace(/[\u1F1E0-\u1F1FF]/g, '[flag]') // Regional indicator symbols (flags)
    .replace(/[\uFE00-\uFE0F]/g, '') // Variation selectors
    .replace(/[\u200D]/g, '') // Zero width joiner
    // Remove any remaining problematic characters
    .replace(/[^\x20-\x7E\s]/g, '') // Keep only printable ASCII + whitespace
    .trim()
}

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  // Check if we have an API key either from config or environment
  const hasApiKey = config.apiKey || 
    (model.providerId === 'google' && process.env.GOOGLE_AI_API_KEY) ||
    (model.providerId === 'openai' && process.env.OPENAI_API_KEY) ||
    (model.providerId === 'anthropic' && process.env.ANTHROPIC_API_KEY) ||
    (model.providerId === 'groq' && process.env.GROQ_API_KEY) ||
    (model.providerId === 'fireworks' && process.env.FIREWORKS_API_KEY) ||
    (model.providerId === 'togetherai' && process.env.TOGETHER_API_KEY) ||
    (model.providerId === 'mistral' && process.env.MISTRAL_API_KEY) ||
    (model.providerId === 'xai' && process.env.XAI_API_KEY)

  const limit = !hasApiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  console.log('userID', userID)
  console.log('teamID', teamID)
  // console.log('template', template)
  console.log('model', model)
  // console.log('config', config)
  
  // Debug: Check for problematic characters
  const systemPrompt = toPrompt(template)
  console.log('System prompt length:', systemPrompt.length)
  console.log('System prompt contains special chars:', /[^\x00-\xFF]/.test(systemPrompt))
  
  // Sanitize system prompt
  const cleanSystemPrompt = sanitizeString(systemPrompt)
  
  // Check and sanitize messages for special characters
  const cleanMessages = messages.map((msg, i) => {
    if (typeof msg.content === 'string') {
      console.log(`Message ${i} contains special chars:`, /[^\x00-\xFF]/.test(msg.content))
      console.log(`Message ${i} content:`, JSON.stringify(msg.content))
      return {
        ...msg,
        content: sanitizeString(msg.content)
      }
    }
    return msg
  }) as CoreMessage[]
  
  console.log('Clean messages:', JSON.stringify(cleanMessages))
  console.log('Model config:', JSON.stringify(config))

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  
  // Sanitize API key - only use environment variable, ignore any user input
  const cleanApiKey = process.env.GOOGLE_AI_API_KEY || undefined
  
  // Check API key for special characters
  if (modelApiKey) {
    console.log('Raw API key contains special chars:', /[^\x00-\xFF]/.test(modelApiKey))
    console.log('Raw API key length:', modelApiKey.length)
  }
  if (cleanApiKey) {
    console.log('Clean API key length:', cleanApiKey.length)
  }
  
  // Use clean config with environment API key
  const cleanConfig = {
    ...config,
    apiKey: cleanApiKey
  }
  
  const modelClient = getModelClient(model, cleanConfig)

  try {
    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema,
      system: cleanSystemPrompt,
      messages: cleanMessages,
      maxRetries: 0, // do not retry on errors
      ...modelParams,
    })

    return stream.toTextStreamResponse()
  } catch (error: any) {
    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit. Try using your own API key.',
        {
          status: 429,
        },
      )
    }

    if (isOverloadedError) {
      return new Response(
        'The provider is currently unavailable. Please try again later.',
        {
          status: 529,
        },
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        'Access denied. Please make sure your API key is valid.',
        {
          status: 403,
        },
      )
    }

    console.error('Error:', error)

    return new Response(
      'An unexpected error has occurred. Please try again later.',
      {
        status: 500,
      },
    )
  }
}
