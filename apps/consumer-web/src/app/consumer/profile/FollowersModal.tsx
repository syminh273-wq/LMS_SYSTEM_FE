import * as React from 'react';
import { X, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";

interface Follower {
  consumer_uid: string;
  name: string;
  avatar: string;
}

interface FollowersModalProps {
  title: string;
  users: Follower[];
  onClose: () => void;
  theme: { accent: string; gradient: string };
}

export function FollowersModal({ title, users, onClose, theme }: FollowersModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl z-[70] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-black text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Trống</div>
          ) : (
            users.map((u) => (
              <div key={u.consumer_uid} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-all group">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback className="bg-muted text-xs font-black uppercase">
                    {u.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Học sinh</p>
                </div>
                <div className={u.name ? theme.accent : ""}>
                   <User size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
