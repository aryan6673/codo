"use client";
import React, { useState } from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatPicker } from "@/components/chat-picker";
import { ChatSettings } from "@/components/chat-settings";
import { ArrowUp, Eye, EyeOff } from "lucide-react";
import { LLMModelConfig } from "@/lib/models";
import { TemplateId } from "@/lib/templates";
import modelsList from "@/lib/models.json";
import templatesList from "@/lib/templates.json";

interface ThreeDCardDemoProps {
  onSubmit?: (prompt: string, languageModel: LLMModelConfig, selectedTemplate: 'auto' | TemplateId) => void;
  isLoading?: boolean;
}

export default function ThreeDCardDemo({ onSubmit, isLoading }: ThreeDCardDemoProps) {
  const [prompt, setPrompt] = useState("");
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto');
  const [languageModel, setLanguageModel] = useState<LLMModelConfig>({
    model: 'models/gemini-1.5-flash',
    temperature: 0.7,
  });

  // Filter models (same logic as in page.tsx)
  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return !['ollama'].includes(model.providerId);
    }
    if (process.env.NEXT_PUBLIC_HIDE_VERTEX_MODELS) {
      return !['vertex', 'ollama'].includes(model.providerId);
    }
    return true;
  });

  const handleLanguageModelChange = (e: LLMModelConfig) => {
    setLanguageModel({ ...languageModel, ...e });
  };

  const handleAnimationToggle = () => {
    setIsAnimationEnabled(!isAnimationEnabled);
  };

  const handleSubmit = () => {
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt.trim(), languageModel, selectedTemplate);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <CardContainer 
      className="inter-var w-full h-full flex items-center justify-center" 
      disabled={!isAnimationEnabled}
      resetOnDisable={true}
    >
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full max-w-[40rem] h-auto rounded-xl p-6 border ">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          What are you gonna launch today ?
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
        >
          write the prompt for your app which you are gonna launch today
        </CardItem>
        <CardItem
          translateZ="100"
          rotateX={5}
          rotateZ={-2}
          className="w-full mt-4"
        >
          {/* Interactive Prompt Input Area */}
          <div className="w-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl group-hover/card:shadow-xl border border-orange-200 dark:border-orange-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl">💬</div>
              <div className="font-semibold text-gray-800 dark:text-white">Enter your prompt</div>
            </div>
            
            {/* Model Selection and Settings */}
            <div className="flex items-center justify-between mb-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-600">
              <div className="flex items-center space-x-2">
                <ChatPicker
                  templates={templatesList}
                  selectedTemplate={selectedTemplate}
                  onSelectedTemplateChange={setSelectedTemplate}
                  models={filteredModels}
                  languageModel={languageModel}
                  onLanguageModelChange={handleLanguageModelChange}
                />
              </div>
              <ChatSettings
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
                apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
              />
            </div>
            
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your app idea... (e.g., 'Create a todo app with dark mode')"
                className="min-h-[100px] resize-none border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 focus:border-orange-500 dark:focus:border-orange-400"
                disabled={isLoading}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading}
                  className="bg-black dark:bg-white dark:text-black text-white hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate
                      <ArrowUp className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardItem>
        <div className="flex justify-between items-center mt-20">
          <CardItem
            translateZ={20}
            translateX={-40}
            as="div"
            className="flex items-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnimationEnabled(!isAnimationEnabled)}
              className="flex items-center gap-2 text-xs font-normal dark:text-white text-muted-foreground hover:bg-transparent"
            >
              {isAnimationEnabled ? (
                <>
                  <Eye className="h-3 w-3" />
                  Animation On
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  Animation Off
                </>
              )}
            </Button>
          </CardItem>
          <CardItem
            translateZ={20}
            translateX={40}
            as="div"
            className="text-xs font-normal dark:text-white text-muted-foreground"
          >
            Codo by Deyweaver
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
