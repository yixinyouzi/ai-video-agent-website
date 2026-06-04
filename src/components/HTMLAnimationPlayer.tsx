import React, { useEffect, useMemo, useRef } from 'react';

interface HTMLAnimationPlayerProps {
  html: string;
  isPlaying?: boolean;
  title?: string;
  className?: string;
}

export default function HTMLAnimationPlayer({
  html,
  isPlaying = true,
  title = 'HTML storyboard animation',
  className = '',
}: HTMLAnimationPlayerProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(() => installPlaybackBridge(html), [html]);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: 'visioncraft-playback', isPlaying }, '*');
  }, [isPlaying, srcDoc]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className={`h-full w-full border-0 bg-black ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={() => frameRef.current?.contentWindow?.postMessage({ type: 'visioncraft-playback', isPlaying }, '*')}
    />
  );
}

function installPlaybackBridge(html: string): string {
  const playbackBridge = `<style id="visioncraft-playback-state">
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#050816}
html.visioncraft-paused *,html.visioncraft-paused *::before,html.visioncraft-paused *::after{animation-play-state:paused!important}
</style>
<script>
window.addEventListener('message',function(event){
  if(!event.data||event.data.type!=='visioncraft-playback')return;
  var playing=Boolean(event.data.isPlaying);
  document.documentElement.classList.toggle('visioncraft-paused',!playing);
  document.getAnimations().forEach(function(animation){playing?animation.play():animation.pause()});
  document.dispatchEvent(new CustomEvent('visioncraft-playback',{detail:{isPlaying:playing}}));
});
</script>`;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${playbackBridge}</head>`) : `${playbackBridge}${html}`;
}
