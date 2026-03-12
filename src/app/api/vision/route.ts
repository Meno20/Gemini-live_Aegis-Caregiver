/**
 * Vision Analysis API - Enhanced Detection Mode
 * Provides realistic simulated analysis for demo purposes with:
 * - More sensitive agitation detection
 * - Door/exit detection
 * - Movement pattern analysis
 */

import { NextRequest, NextResponse } from 'next/server'

// Track previous states for change detection
let previousStates: {
  room: string
  agitationLevel: number
  movement: string
  lastChange: number
} = {
  room: 'living_room',
  agitationLevel: 0.1,
  movement: 'sitting',
  lastChange: Date.now()
}

// Simulated analysis patterns based on time and context
function generateSimulatedAnalysis() {
  const hour = new Date().getHours()
  const minute = new Date().getMinutes()
  const second = new Date().getSeconds()
  
  // More dynamic agitation based on multiple factors
  let baseAgitation = 0.15
  
  // Sundowning effect (4 PM - 8 PM)
  if (hour >= 16 && hour <= 20) {
    baseAgitation = 0.35 + Math.sin((minute / 60) * Math.PI) * 0.2
  } 
  // Morning confusion (6 AM - 9 AM)
  else if (hour >= 6 && hour <= 9) {
    baseAgitation = 0.2 + Math.random() * 0.15
  }
  // Night wandering (12 AM - 5 AM)
  else if (hour >= 0 && hour <= 5) {
    baseAgitation = 0.25 + Math.random() * 0.25
  }
  // Normal daytime
  else {
    baseAgitation = 0.15 + Math.random() * 0.15
  }
  
  // Add micro-variations for more sensitive detection
  const agitationVariation = Math.sin(second * 0.1) * 0.05 + (Math.random() - 0.5) * 0.1
  
  // Detect agitation spikes (sudden changes)
  const agitationSpike = Math.random() < 0.1 ? 0.15 : 0
  
  const agitationLevel = Math.max(0.05, Math.min(0.95, baseAgitation + agitationVariation + agitationSpike))
  
  // Room selection with time-based patterns
  const rooms = ['living_room', 'kitchen', 'bedroom', 'bathroom', 'hallway']
  const roomWeights = [0.35, 0.25, 0.15, 0.12, 0.13]
  
  // Meal times - more likely in kitchen
  if ((hour >= 7 && hour <= 8) || (hour >= 12 && hour <= 13) || (hour >= 18 && hour <= 19)) {
    roomWeights[1] = 0.45
    roomWeights[0] = 0.25
  }
  
  // Night time - more likely in bedroom or hallway (wandering)
  if (hour >= 22 || hour <= 5) {
    roomWeights[2] = 0.4  // bedroom
    roomWeights[4] = 0.25 // hallway (wandering)
    roomWeights[0] = 0.2
    roomWeights[1] = 0.1
    roomWeights[3] = 0.05
  }
  
  // Sundowning - more hallway movement
  if (hour >= 16 && hour <= 20) {
    roomWeights[4] = 0.25
    roomWeights[0] = 0.3
  }
  
  // Select room based on weights
  const random = Math.random()
  let cumulative = 0
  let selectedRoom = 'living_room'
  for (let i = 0; i < rooms.length; i++) {
    cumulative += roomWeights[i]
    if (random < cumulative) {
      selectedRoom = rooms[i]
      break
    }
  }
  
  // Detect doors and exits based on room
  const doorKeywords = ['door', 'exit', 'entrance', 'gateway', 'threshold']
  
  // Exit detection - increased probability
  // Hallways and near exterior walls have higher exit proximity
  let isNearExit = false
  let exitProbability = 0.03 // base probability
  
  if (selectedRoom === 'hallway') {
    exitProbability = 0.15 // Hallways often have exits
  } else if (selectedRoom === 'living_room') {
    exitProbability = 0.08 // Living rooms may have patio/front doors
  } else if (selectedRoom === 'kitchen') {
    exitProbability = 0.06 // Kitchen might have back door
  }
  
  // Increase exit probability during sundowning/wandering periods
  if (hour >= 16 && hour <= 20) {
    exitProbability *= 2
  }
  if (hour >= 0 && hour <= 5) {
    exitProbability *= 3
  }
  
  // High agitation increases wandering toward exits
  if (agitationLevel > 0.5) {
    exitProbability *= 1.5
  }
  
  isNearExit = Math.random() < exitProbability
  
  // Movement detection based on time and agitation
  let movement = 'sitting'
  const movementRandom = Math.random()
  
  if (agitationLevel > 0.6) {
    // High agitation - more pacing
    if (movementRandom < 0.4) movement = 'pacing'
    else if (movementRandom < 0.6) movement = 'restless'
    else if (movementRandom < 0.8) movement = 'standing'
    else movement = 'walking'
  } else if (agitationLevel > 0.35) {
    // Moderate agitation
    if (movementRandom < 0.2) movement = 'pacing'
    else if (movementRandom < 0.4) movement = 'restless'
    else if (movementRandom < 0.6) movement = 'walking'
    else if (movementRandom < 0.8) movement = 'standing'
    else movement = 'sitting'
  } else {
    // Low agitation - calm
    if (movementRandom < 0.1) movement = 'walking'
    else if (movementRandom < 0.2) movement = 'standing'
    else if (movementRandom < 0.3) movement = 'shifting'
    else movement = 'sitting'
  }
  
  // Night wandering
  if (hour >= 0 && hour <= 5 && Math.random() > 0.5) {
    movement = 'wandering'
  }
  
  // Activities based on room and time
  const activitiesByRoom: Record<string, string[]> = {
    living_room: [
      'watching television',
      'looking out the window',
      'sitting on the couch',
      'looking at family photos',
      'reading a magazine',
      'dozing in the chair',
      'looking around confused',
      'trying to leave the room'
    ],
    kitchen: [
      'looking in the refrigerator',
      'making a cup of tea',
      'standing at the counter',
      'looking for something to eat',
      'washing hands',
      'opening cabinets',
      'drinking water'
    ],
    bedroom: [
      'lying in bed',
      'sitting on the edge of the bed',
      'looking for something',
      'getting dressed',
      'folding clothes',
      'looking at photos on nightstand'
    ],
    bathroom: [
      'washing hands',
      'looking in the mirror',
      'using the facilities',
      'adjusting clothing'
    ],
    hallway: [
      'walking toward exit',
      'walking slowly',
      'standing and looking around',
      'holding onto the wall',
      'pacing back and forth',
      'appearing lost'
    ]
  }
  
  const roomActivities = activitiesByRoom[selectedRoom] || activitiesByRoom['living_room']
  const activity = roomActivities[Math.floor(Math.random() * roomActivities.length)]
  
  // Patient visible (high probability, occasionally not visible)
  const patientVisible = Math.random() > 0.08
  
  // Calculate confidence based on conditions
  let confidence = 0.75
  if (agitationLevel > 0.5) confidence -= 0.05 // Harder to analyze agitated patients
  if (selectedRoom === 'hallway') confidence += 0.05 // More open space
  if (!patientVisible) confidence = 0.4 // Low confidence if not visible
  confidence += (Math.random() - 0.5) * 0.1
  
  // Determine if sitting
  const isSitting = movement === 'sitting' || movement === 'shifting' || movement === 'dozing'
  
  // Track state changes
  const stateChanged = 
    selectedRoom !== previousStates.room ||
    Math.abs(agitationLevel - previousStates.agitationLevel) > 0.15 ||
    movement !== previousStates.movement
  
  if (stateChanged) {
    previousStates = {
      room: selectedRoom,
      agitationLevel,
      movement,
      lastChange: Date.now()
    }
  }
  
  const analysis = {
    room: selectedRoom,
    isNearExit,
    isSitting,
    agitationLevel: Math.round(agitationLevel * 100) / 100,
    movement,
    activity,
    patientVisible,
    confidence: Math.round(confidence * 100) / 100,
    stateChanged,
    doorDetected: isNearExit || selectedRoom === 'hallway',
    timeContext: {
      hour,
      isSundowning: hour >= 16 && hour <= 20,
      isNightWandering: hour >= 0 && hour <= 5
    }
  }
  
  return analysis
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image required' 
      }, { status: 400 })
    }

    // Generate enhanced simulated analysis
    const analysis = generateSimulatedAnalysis()

    // Log significant events
    const logParts = [
      `📷 Vision: ${analysis.room}`,
      `agitation: ${Math.round(analysis.agitationLevel * 100)}%`,
      `movement: ${analysis.movement}`,
      `nearExit: ${analysis.isNearExit}`,
      `door: ${analysis.doorDetected}`
    ]
    
    if (analysis.isNearExit) {
      console.log('🚨 NEAR EXIT DETECTED!', analysis.room, analysis.activity)
    }
    if (analysis.agitationLevel > 0.5) {
      console.log('⚠️ High agitation detected:', Math.round(analysis.agitationLevel * 100) + '%')
    }
    if (analysis.stateChanged) {
      console.log('📊 State changed:', logParts.join(' | '))
    }

    return NextResponse.json({ 
      success: true, 
      analysis,
      simulated: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Vision analysis error:', error)
    
    // Return a safe default analysis
    return NextResponse.json({
      success: true,
      analysis: {
        room: 'living_room',
        isNearExit: false,
        isSitting: true,
        agitationLevel: 0.15,
        movement: 'sitting',
        activity: 'sitting quietly',
        patientVisible: true,
        confidence: 0.8,
        stateChanged: false,
        doorDetected: false
      },
      simulated: true
    })
  }
}

// GET endpoint for testing
export async function GET() {
  const analysis = generateSimulatedAnalysis()
  return NextResponse.json({ 
    success: true, 
    analysis,
    simulated: true 
  })
}
