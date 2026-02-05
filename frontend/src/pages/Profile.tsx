 import { Link } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { BrutalButton } from '@/components/ui/BrutalButton';
 import { BrutalCard } from '@/components/ui/BrutalCard';
 import { useGame } from '@/contexts/GameContext';
 
 export default function Profile() {
   const { user, logout } = useGame();
 
   if (!user) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <BrutalCard className="p-8 text-center">
           <p className="text-xl font-bold uppercase mb-4">NOT LOGGED IN</p>
           <Link to="/login">
             <BrutalButton variant="primary">LOGIN →</BrutalButton>
           </Link>
         </BrutalCard>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="border-b-[4px] border-foreground p-4">
         <div className="container mx-auto flex items-center justify-between">
           <Link to="/lobby">
             <BrutalButton variant="outline" size="sm">
               ← BACK TO LOBBY
             </BrutalButton>
           </Link>
           <h1 className="text-2xl font-bold uppercase tracking-tighter">
             LAST HAND<span className="text-primary">_OS</span>
           </h1>
           <BrutalButton variant="destructive" size="sm" onClick={logout}>
             LOGOUT
           </BrutalButton>
         </div>
       </header>
 
       {/* Profile Content */}
       <main className="flex-1 container mx-auto p-4 py-8">
         <div className="grid lg:grid-cols-3 gap-8">
           {/* Profile Card */}
           <div className="lg:col-span-1">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2 }}
             >
               <BrutalCard variant="dark" className="p-6 text-center">
                 {/* Avatar */}
                 <div className="w-24 h-24 mx-auto mb-4 bg-primary border-[4px] border-background flex items-center justify-center">
                   <span className="text-4xl font-bold text-primary-foreground">
                     {user.displayName[0]}
                   </span>
                 </div>
                 
                 {/* Name */}
                 <h2 className="text-2xl font-bold uppercase mb-1">
                   {user.displayName}
                 </h2>
                 <p className="font-mono text-primary mb-4">{user.ensName}</p>
                 
                 {/* Address (mock) */}
                 <div className="p-3 bg-background/10 border-[2px] border-background/20">
                   <p className="text-xs font-mono opacity-70 truncate">
                     0x{user.ensName.replace('.eth', '').padEnd(40, '0')}
                   </p>
                 </div>
                 
                 {/* ENS Comment */}
                 <p className="mt-4 text-[10px] font-mono opacity-50">
                   // ENS resolver: {user.ensName} → Sui address
                 </p>
               </BrutalCard>
             </motion.div>
           </div>
 
           {/* Stats & Settings */}
           <div className="lg:col-span-2 space-y-6">
             {/* Stats Grid */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2, delay: 0.1 }}
             >
               <h3 className="text-xl font-bold uppercase mb-4">STATISTICS</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <BrutalCard className="p-4 text-center">
                   <p className="text-3xl font-bold">{user.totalMatches}</p>
                   <p className="text-xs font-mono opacity-70 uppercase">TOTAL MATCHES</p>
                 </BrutalCard>
                 <BrutalCard variant="accent" className="p-4 text-center">
                   <p className="text-3xl font-bold">{user.wins}</p>
                   <p className="text-xs font-mono opacity-70 uppercase">WINS</p>
                 </BrutalCard>
                 <BrutalCard className="p-4 text-center">
                   <p className="text-3xl font-bold">{user.losses}</p>
                   <p className="text-xs font-mono opacity-70 uppercase">LOSSES</p>
                 </BrutalCard>
                 <BrutalCard className="p-4 text-center">
                   <p className="text-3xl font-bold">
                     {user.totalMatches > 0 
                       ? Math.round((user.wins / user.totalMatches) * 100) 
                       : 0}%
                   </p>
                   <p className="text-xs font-mono opacity-70 uppercase">WIN RATE</p>
                 </BrutalCard>
               </div>
             </motion.div>
 
             {/* Financial Stats */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2, delay: 0.15 }}
             >
               <h3 className="text-xl font-bold uppercase mb-4">FINANCIALS</h3>
               <div className="grid md:grid-cols-3 gap-4">
                 <BrutalCard className="p-4">
                   <p className="text-xs font-mono opacity-50 uppercase mb-1">TOTAL EARNINGS</p>
                   <p className="text-2xl font-mono font-bold text-success">${user.totalEarnings}</p>
                 </BrutalCard>
                 <BrutalCard className="p-4">
                   <p className="text-xs font-mono opacity-50 uppercase mb-1">TOTAL SPENT</p>
                   <p className="text-2xl font-mono font-bold text-destructive">${user.totalSpent}</p>
                 </BrutalCard>
                 <BrutalCard className="p-4">
                   <p className="text-xs font-mono opacity-50 uppercase mb-1">NET PROFIT</p>
                   <p className={`text-2xl font-mono font-bold ${
                     user.totalEarnings - user.totalSpent >= 0 ? 'text-success' : 'text-destructive'
                   }`}>
                     ${user.totalEarnings - user.totalSpent}
                   </p>
                 </BrutalCard>
               </div>
             </motion.div>
 
             {/* Spend Limit */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2, delay: 0.2 }}
             >
               <BrutalCard className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold uppercase">SPEND LIMIT</h3>
                   <span className="px-3 py-1 bg-muted border-[2px] border-foreground text-sm font-mono">
                     ${user.spendLimit}/match
                   </span>
                 </div>
                 <p className="text-sm font-mono opacity-70 mb-4">
                   Maximum amount you can wager per match session
                 </p>
                 <div className="flex gap-2">
                   {[100, 250, 500, 1000].map((limit) => (
                     <button
                       key={limit}
                       className={`flex-1 py-2 border-[2px] border-foreground font-bold text-sm transition-all ${
                         user.spendLimit === limit 
                           ? 'bg-primary text-primary-foreground' 
                           : 'bg-card hover:bg-muted'
                       }`}
                     >
                       ${limit}
                     </button>
                   ))}
                 </div>
               </BrutalCard>
             </motion.div>
 
             {/* Preferences */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2, delay: 0.25 }}
             >
               <BrutalCard className="p-6">
                 <h3 className="text-lg font-bold uppercase mb-4">PREFERENCES</h3>
                 <div className="space-y-4">
                   {[
                     { key: 'autoFold', label: 'Auto-fold on disconnect', value: user.preferences.autoFold },
                     { key: 'soundEnabled', label: 'Sound effects', value: user.preferences.soundEnabled },
                     { key: 'notifications', label: 'Match notifications', value: user.preferences.notifications },
                   ].map((pref) => (
                     <div key={pref.key} className="flex items-center justify-between p-3 border-[2px] border-foreground">
                       <span className="font-mono text-sm">{pref.label}</span>
                       <div className={`w-12 h-6 border-[2px] border-foreground flex items-center px-0.5 cursor-pointer ${
                         pref.value ? 'bg-primary justify-end' : 'bg-muted justify-start'
                       }`}>
                         <div className="w-4 h-4 bg-foreground" />
                       </div>
                     </div>
                   ))}
                 </div>
               </BrutalCard>
             </motion.div>
 
             {/* Past Matches Placeholder */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.2, delay: 0.3 }}
             >
               <h3 className="text-xl font-bold uppercase mb-4">PAST MATCHES</h3>
               <BrutalCard variant="muted" className="p-8 text-center">
                 <p className="font-mono text-sm opacity-70">No completed matches yet</p>
                 <Link to="/lobby" className="inline-block mt-4">
                   <BrutalButton variant="primary">FIND A MATCH →</BrutalButton>
                 </Link>
               </BrutalCard>
             </motion.div>
           </div>
         </div>
       </main>
     </div>
   );
 }