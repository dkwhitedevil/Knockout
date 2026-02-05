 import { forwardRef, HTMLAttributes } from 'react';
 import { cva, type VariantProps } from 'class-variance-authority';
 import { cn } from '@/lib/utils';
 
 const brutalCardVariants = cva(
   'border-[3px] border-foreground transition-all duration-75',
   {
     variants: {
       variant: {
         default: 'bg-card',
         accent: 'bg-primary',
         muted: 'bg-muted',
         dark: 'bg-foreground text-background',
       },
       shadow: {
         default: 'shadow-brutal',
         lg: 'shadow-brutal-lg',
         none: '',
         accent: 'shadow-brutal-accent',
       },
       padding: {
         none: 'p-0',
         sm: 'p-3',
         default: 'p-6',
         lg: 'p-8',
       },
     },
     defaultVariants: {
       variant: 'default',
       shadow: 'default',
       padding: 'default',
     },
   }
 );
 
 export interface BrutalCardProps
   extends HTMLAttributes<HTMLDivElement>,
     VariantProps<typeof brutalCardVariants> {}
 
 const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
   ({ className, variant, shadow, padding, ...props }, ref) => {
     return (
       <div
         ref={ref}
         className={cn(brutalCardVariants({ variant, shadow, padding, className }))}
         {...props}
       />
     );
   }
 );
 
 BrutalCard.displayName = 'BrutalCard';
 
 export { BrutalCard, brutalCardVariants };