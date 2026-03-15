/**
 * Aegis AI SDK Wrapper
 * Provides a clean interface to the AI capabilities
 */

import AISDK from 'z-ai-web-dev-sdk'

export type AIInstance = Awaited<ReturnType<typeof AISDK.create>>

/**
 * Create an AI instance for use throughout the application
 */
export async function createAI(): Promise<AIInstance> {
  return AISDK.create()
}

export default AISDK
