module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/video/signaling/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const state = {
    viewers: new Map(),
    command: null,
    controllerLastSeen: 0,
    pendingOffers: new Map(),
    pendingAnswers: new Map(),
    iceCandidatesForViewer: new Map(),
    iceCandidatesForController: []
};
const CLEANUP_INTERVAL = 10000;
const STALE_THRESHOLD = 15000;
if (typeof globalThis !== 'undefined') {
    const globalWithCleanup = globalThis;
    if (!globalWithCleanup.signalingCleanup) {
        globalWithCleanup.signalingCleanup = setInterval(()=>{
            const now = Date.now();
            for (const [id, viewer] of state.viewers){
                if (now - viewer.lastSeen > STALE_THRESHOLD) {
                    state.viewers.delete(id);
                    state.pendingOffers.delete(id);
                    state.pendingAnswers.delete(id);
                    state.iceCandidatesForViewer.delete(id);
                }
            }
            for (const [id, offer] of state.pendingOffers){
                if (now - offer.timestamp > STALE_THRESHOLD) {
                    state.pendingOffers.delete(id);
                }
            }
            for (const [id, answer] of state.pendingAnswers){
                if (now - answer.timestamp > STALE_THRESHOLD) {
                    state.pendingAnswers.delete(id);
                }
            }
            state.iceCandidatesForController = state.iceCandidatesForController.filter((c)=>now - c.timestamp < STALE_THRESHOLD);
            if (now - state.controllerLastSeen > STALE_THRESHOLD) {
                state.command = null;
            }
        }, CLEANUP_INTERVAL);
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { action, id, enabled, signal, isFromController } = body;
        const now = Date.now();
        const getActiveViewers = ()=>{
            return Array.from(state.viewers.values()).filter((v)=>now - v.lastSeen < STALE_THRESHOLD);
        };
        switch(action){
            case 'register-controller':
            case 'heartbeat-controller':
                {
                    state.controllerLastSeen = now;
                    const activeViewers = getActiveViewers();
                    const offers = Array.from(state.pendingOffers.values()).filter((o)=>now - o.timestamp < STALE_THRESHOLD);
                    const iceCandidates = state.iceCandidatesForController.filter((c)=>now - c.timestamp < STALE_THRESHOLD);
                    if (action === 'heartbeat-controller') {
                        state.iceCandidatesForController = [];
                    }
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true,
                        viewerCount: activeViewers.length,
                        viewers: activeViewers.map((v)=>({
                                id: v.id,
                                cameraEnabled: v.cameraEnabled
                            })),
                        offers,
                        iceCandidates
                    });
                }
            case 'register-viewer':
                {
                    if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID required'
                    }, {
                        status: 400
                    });
                    state.viewers.set(id, {
                        id,
                        lastSeen: now,
                        cameraEnabled: false
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true,
                        command: state.command && now - state.command.timestamp < STALE_THRESHOLD ? state.command : null
                    });
                }
            case 'heartbeat-viewer':
                {
                    if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID required'
                    }, {
                        status: 400
                    });
                    const viewer = state.viewers.get(id);
                    if (viewer) {
                        viewer.lastSeen = now;
                    } else {
                        state.viewers.set(id, {
                            id,
                            lastSeen: now,
                            cameraEnabled: false
                        });
                    }
                    const answer = state.pendingAnswers.get(id);
                    const candidates = state.iceCandidatesForViewer.get(id) || [];
                    const iceCandidates = candidates.filter((c)=>now - c.timestamp < STALE_THRESHOLD);
                    state.iceCandidatesForViewer.set(id, []);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true,
                        command: state.command && now - state.command.timestamp < STALE_THRESHOLD ? state.command : null,
                        answer: answer && now - answer.timestamp < STALE_THRESHOLD ? answer : null,
                        iceCandidates
                    });
                }
            case 'send-command':
                {
                    state.controllerLastSeen = now;
                    state.command = {
                        enabled: enabled === true,
                        timestamp: now
                    };
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            case 'update-status':
                {
                    if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID required'
                    }, {
                        status: 400
                    });
                    const viewerToUpdate = state.viewers.get(id);
                    if (viewerToUpdate) {
                        viewerToUpdate.cameraEnabled = enabled === true;
                        viewerToUpdate.lastSeen = now;
                    }
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            case 'disconnect-viewer':
                {
                    if (id) {
                        state.viewers.delete(id);
                        state.pendingOffers.delete(id);
                        state.pendingAnswers.delete(id);
                        state.iceCandidatesForViewer.delete(id);
                    }
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            case 'webrtc-offer':
                {
                    if (!id || !signal) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID & signal required'
                    }, {
                        status: 400
                    });
                    state.pendingOffers.set(id, {
                        viewerId: id,
                        type: 'offer',
                        data: signal,
                        timestamp: now
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            case 'webrtc-answer':
                {
                    if (!id || !signal) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID & signal required'
                    }, {
                        status: 400
                    });
                    state.pendingAnswers.set(id, {
                        viewerId: id,
                        type: 'answer',
                        data: signal,
                        timestamp: now
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            case 'webrtc-ice-candidate':
                {
                    if (!id || !signal) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Viewer ID & signal required'
                    }, {
                        status: 400
                    });
                    const candidate = {
                        viewerId: id,
                        type: 'ice-candidate',
                        data: signal,
                        timestamp: now
                    };
                    if (isFromController) {
                        if (!state.iceCandidatesForViewer.has(id)) state.iceCandidatesForViewer.set(id, []);
                        state.iceCandidatesForViewer.get(id).push(candidate);
                    } else {
                        state.iceCandidatesForController.push(candidate);
                    }
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true
                    });
                }
            default:
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Invalid action'
                }, {
                    status: 400
                });
        }
    } catch (error) {
        console.error('Signaling API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function GET() {
    const now = Date.now();
    const activeViewers = Array.from(state.viewers.values()).filter((v)=>now - v.lastSeen < STALE_THRESHOLD);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        status: 'ok',
        controllerActive: now - state.controllerLastSeen < STALE_THRESHOLD,
        viewerCount: activeViewers.length
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ae044ebf._.js.map