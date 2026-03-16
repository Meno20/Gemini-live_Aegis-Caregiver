module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},874,(e,t,r)=>{t.exports=e.x("buffer",()=>require("buffer"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},24836,(e,t,r)=>{t.exports=e.x("https",()=>require("https"))},46786,(e,t,r)=>{t.exports=e.x("os",()=>require("os"))},21517,(e,t,r)=>{t.exports=e.x("http",()=>require("http"))},4446,(e,t,r)=>{t.exports=e.x("net",()=>require("net"))},55004,(e,t,r)=>{t.exports=e.x("tls",()=>require("tls"))},92509,(e,t,r)=>{t.exports=e.x("url",()=>require("url"))},65296,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),i=e.i(74677),o=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),h=e.i(70101),g=e.i(26937),v=e.i(10372),x=e.i(93695);e.i(52474);var f=e.i(220),m=e.i(89171),y=e.i(8223);async function R(e){try{let{patientId:t,behavioralLogs:r,analysisType:a}=await e.json();if(!r||!Array.isArray(r))return m.NextResponse.json({error:"behavioralLogs array required"},{status:400});let n="pattern-analysis",s="";switch(a){case"uti-screening":n="uti-detection",s=`URGENT MEDICAL SCREENING

Analyze ${r.length} data points for UTI indicators:
- Sudden confusion increase (baseline vs current)
- Increased bathroom frequency
- Agitation without clear behavioral trigger
- Sleep disruption pattern change
- Temperature/fever mentions

DATA:
${JSON.stringify(r,null,2)}

Return JSON:
{
  "uti_probability": "low|moderate|high|critical",
  "confidence": 0-100,
  "supporting_evidence": [],
  "contradicting_evidence": [],
  "confusion_trend": { "baseline": 0, "current": 0, "change_percent": 0 },
  "bathroom_frequency_trend": { "baseline": 0, "current": 0 },
  "recommendation": "string",
  "urgency": "routine|soon|within_24hrs|immediate",
  "alert_caregiver": false,
  "alert_physician": false
}`;break;case"care-plan":n="care-plan",s=`Generate a personalized care plan based on ${r.length} days of data.

DATA:
${JSON.stringify(r,null,2)}

Include:
- Daily routine optimization (based on observed patterns)
- Activity scheduling (matched to patient's interests/history)
- Intervention strategies for identified triggers
- Medication management adjustments
- Caregiver respite recommendations
- Goals for the next 30 days`;break;default:n="pattern-analysis",s=`Analyze ${r.length} data points for behavioral patterns.

DATA:
${JSON.stringify(r,null,2)}

Identify:
1. Time-of-day patterns (when is patient most/least agitated?)
2. Day-of-week correlations (recurring triggers?)
3. Trigger-behavior chains (what causes what?)
4. Deterioration vs baseline trends
5. Sleep pattern changes
6. Social interaction effects
7. Environmental factors
8. Caregiver behavior correlations

Return JSON:
{
  "patterns": [
    {
      "pattern": "description",
      "frequency": "daily|weekly|irregular",
      "trigger": "identified trigger or null",
      "severity": "low|medium|high",
      "intervention": "recommended action"
    }
  ],
  "trends": {
    "cognitive": "stable|declining|improving",
    "behavioral": "stable|declining|improving",
    "physical": "stable|declining|improving"
  },
  "medical_flags": [],
  "positive_observations": [],
  "recommended_interventions": [],
  "caregiver_notes": "string"
}`}let i=await (0,y.runTask)(n,[{role:"user",parts:[{text:s}]}],{systemInstruction:y.SYSTEM_PROMPTS.patternAnalysis});return m.NextResponse.json({success:!0,analysis:i.text,model_used:"gemini-2.5-pro",analyzed_at:new Date().toISOString(),data_points:r.length})}catch(e){return console.error("[Aegis Analysis] Error:",e),m.NextResponse.json({error:e.message||"Analysis failed"},{status:500})}}e.s(["POST",()=>R],95666);var b=e.i(95666);let w=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/analysis/route",pathname:"/api/analysis",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/analysis/route.ts",nextConfigOutput:"standalone",userland:b}),{workAsyncStorage:_,workUnitAsyncStorage:E,serverHooks:A}=w;function C(){return(0,a.patchFetch)({workAsyncStorage:_,workUnitAsyncStorage:E})}async function T(e,t,a){w.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let m="/api/analysis/route";m=m.replace(/\/index$/,"")||"/";let y=await w.prepare(e,t,{srcPage:m,multiZoneDraftMode:!1});if(!y)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:b,nextConfig:_,parsedUrl:E,isDraftMode:A,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:S,revalidateOnlyGenerated:q,resolvedPathname:N,clientReferenceManifest:k,serverActionsManifest:O}=y,P=(0,o.normalizeAppPath)(m),j=!!(C.dynamicRoutes[P]||C.routes[N]),I=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,E,!1):t.end("This page could not be found"),null);if(j&&!A){let e=!!C.routes[N],t=C.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(_.experimental.adapterPath)return await I();throw new x.NoFallbackError}}let D=null;!j||w.isDev||A||(D="/index"===(D=N)?"/":D);let U=!0===w.isDev||!j,H=j&&!U;O&&k&&(0,i.setManifestsSingleton)({page:m,clientReferenceManifest:k,serverActionsManifest:O});let M=e.method||"GET",$=(0,s.getTracer)(),F=$.getActiveScopeSpan(),K={params:b,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!_.experimental.authInterrupts},cacheComponents:!!_.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:_.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>w.onRequestError(e,t,a,n,T)},sharedContext:{buildId:R}},G=new l.NodeNextRequest(e),L=new l.NodeNextResponse(t),z=d.NextRequestAdapter.fromNodeNextRequest(G,(0,d.signalFromNodeResponse)(t));try{let i=async e=>w.handle(z,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=$.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${M} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${m}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&S&&q&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=K.renderOpts.collectedTags;if(!j)return await (0,p.sendResponse)(G,L,s,K.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(s.headers);d&&(t[v.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=v.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,a=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=v.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await w.onRequestError(e,t,{routerKind:"App Router",routePath:m,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:S})},!1,T),t}},u=await w.handleResponse({req:e,nextConfig:_,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:q,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:o});if(!j)return null;if((null==u||null==(s=u.value)?void 0:s.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",S?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,h.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&j||x.delete(v.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(G,L,new Response(u.value.body,{headers:x,status:u.value.status||200})),null};F?await l(F):await $.withPropagatedContext(e.headers,()=>$.trace(u.BaseServerSpan.handleRequest,{spanName:`${M} ${m}`,kind:s.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await w.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:S})},!1,T),j)throw t;return await (0,p.sendResponse)(G,L,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>C,"routeModule",()=>w,"serverHooks",()=>A,"workAsyncStorage",()=>_,"workUnitAsyncStorage",()=>E],65296)},85685,e=>{e.v(e=>Promise.resolve().then(()=>e(54799)))},91961,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__c130a00c._.js"].map(t=>e.l(t))).then(()=>t(12111)))},72331,e=>{e.v(t=>Promise.all(["server/chunks/node_modules_node-fetch_src_utils_multipart-parser_9a876d66.js","server/chunks/[root-of-the-server]__c08a7b0d._.js","server/chunks/[root-of-the-server]__e24658a7._.js"].map(t=>e.l(t))).then(()=>t(20442)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__ed3d1366._.js.map