"use client";
import React, { useState } from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";

interface ThreeDCardDemoProps {
  onSubmit?: (prompt: string) => void;
  isLoading?: boolean;
}

export default function ThreeDCardDemo({ onSubmit, isLoading }: ThreeDCardDemoProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && onSubmit) {
      onSubmit(prompt.trim());
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
    <CardContainer className="inter-var w-full h-full flex items-center justify-center">
      <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full max-w-[40rem] h-auto rounded-xl p-6 border ">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          AI Prompt Block
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
        >
          Write your prompt below to generate interactive code with AI
        </CardItem>
        <CardItem
          translateZ="100"
          rotateX={20}
          rotateZ={-10}
          className="w-full mt-4"
        >
          {/* Interactive Prompt Input Area */}
          <div className="w-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl group-hover/card:shadow-xl border border-orange-200 dark:border-orange-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl">💬</div>
              <div className="font-semibold text-gray-800 dark:text-white">Enter your prompt</div>
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
            className="text-xs font-normal dark:text-white text-muted-foreground"
          >
            Powered by AI ✨
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
