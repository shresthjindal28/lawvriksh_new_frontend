import VideoLoader from '@/components/ui/VideoLoader';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <VideoLoader width={150} height={150} />
    </div>
  );
}
