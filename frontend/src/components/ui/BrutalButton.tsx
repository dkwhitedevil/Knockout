 import { forwardRef, ButtonHTMLAttributes } from 'react';
 import { cva, type VariantProps } from 'class-variance-authority';
 import { cn } from '@/lib/utils';
 
 const brutalButtonVariants = cva(
   'inline-flex items-center justify-center font-bold uppercase tracking-wide border-[3px] border-foreground transition-all duration-75 select-none disabled:opacity-50 disabled:pointer-events-none',
   {
     variants: {
       variant: {
         default: 'bg-background text-foreground hover:bg-muted',
         primary: 'bg-primary text-primary-foreground hover:brightness-110',
         destructive: 'bg-destructive text-destructive-foreground',
         outline: 'bg-transparent text-foreground hover:bg-foreground hover:text-background',
         ghost: 'border-transparent bg-transparent hover:bg-muted',
       },
       size: {
         sm: 'h-9 px-4 text-sm',
         default: 'h-12 px-6 text-base',
         lg: 'h-14 px-8 text-lg',
         xl: 'h-16 px-10 text-xl',
         icon: 'h-12 w-12',
       },
       shadow: {
         default: 'shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
         none: '',
         accent: 'shadow-brutal-accent hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
       },
     },
     defaultVariants: {
       variant: 'default',
       size: 'default',
       shadow: 'default',
     },
   }
 );
 
 export interface BrutalButtonProps
   extends ButtonHTMLAttributes<HTMLButtonElement>,
     VariantProps<typeof brutalButtonVariants> {}
 
 const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
   ({ className, variant, size, shadow, ...props }, ref) => {
     return (
       <button
         className={cn(brutalButtonVariants({ variant, size, shadow, className }))}
         ref={ref}
         {...props}
       />
     );
   }
 );
 
 BrutalButton.displayName = 'BrutalButton';
 
 export { BrutalButton, brutalButtonVariants };