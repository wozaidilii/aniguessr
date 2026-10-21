const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized;
}

export const POSTHOG_PROJECT_TOKEN =
  normalizeEnvValue(process.env.NEXT_PUBLIC_POSTHOG_KEY) ??
  normalizeEnvValue(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) ??
  normalizeEnvValue(process.env.NEXT_PUBLIC_POSTHOG_TOKEN);

export const POSTHOG_HOST =
  normalizeEnvValue(process.env.NEXT_PUBLIC_POSTHOG_HOST) ??
  DEFAULT_POSTHOG_HOST;

export const POSTHOG_DEFAULTS_DATE = "2026-05-30";

export function buildPostHogCaptureUrl(apiHost = POSTHOG_HOST) {
  return `${apiHost.replace(/\/+$/, "")}/i/v0/e/`;
}

/** Browser init. Autocapture stays off and session replay is forced off. */
export function buildPostHogSnippet(projectToken: string, apiHost: string) {
  return `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(${JSON.stringify(projectToken)}, {
  api_host: ${JSON.stringify(apiHost)},
  defaults: ${JSON.stringify(POSTHOG_DEFAULTS_DATE)},
  person_profiles: "identified_only",
  autocapture: false,
  capture_pageview: false,
  disable_session_recording: true
});
`.trim();
}
