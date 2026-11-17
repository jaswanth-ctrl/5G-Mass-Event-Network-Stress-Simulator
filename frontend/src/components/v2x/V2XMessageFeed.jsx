import { memo } from 'react';

const MessageItem = memo(({ msg }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs font-mono">
    <div className="flex justify-between text-blue-600 mb-1">
      <span>[{new Date().toLocaleTimeString('en-GB')}] DENM from {msg.vehicleId}</span>
      <span className="text-emerald-600 font-bold">{msg.latencyMs}ms</span>
    </div>
    <div className="text-slate-500 flex justify-between">
      <span>Pos: ({msg.position?.x?.toFixed(2)}, {msg.position?.y?.toFixed(2)})</span>
      <span className="text-purple-600 font-bold">{msg.sliceUsed}</span>
    </div>
  </div>
));

export const V2XMessageFeed = ({ messages, msgRate }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col max-h-[300px]">
      <div className="p-3 border-b border-slate-100 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Live PC5 / DENM Feed</h3>
        <span className="font-mono text-xs text-blue-600 font-bold">{msgRate || 0} msg/sec</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {!messages || messages.length === 0 ? (
          <div className="flex items-center justify-center text-slate-400 font-mono text-sm py-6">
            Waiting for V2X broadcasts...
          </div>
        ) : (
          messages.slice(0, 8).map((msg, i) => (
            <MessageItem key={msg.messageId || i} msg={msg} />
          ))
        )}
      </div>
    </div>
  );
};
