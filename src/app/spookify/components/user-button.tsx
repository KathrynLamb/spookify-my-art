// features/auth/components/user-button.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Loader, User } from "lucide-react";

import { useEffect, useState } from 'react';

export const UserButton = () => {
  const { data: session, status } = useSession();

  const router = useRouter();

  // tiny mount guard so SSR/CSR trees match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-10 w-10 rounded-full bg-white/10" />;

  const login = () => router.push('/');

  const initials =
    (session?.user?.name ?? 'You')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const triggerContent = session?.user ? (
    <Avatar className="size-10">
      <AvatarImage src={session.user.image ?? ''} alt={session.user.name ?? 'User'} />
      <AvatarFallback className="bg-indigo-500 text-white">{initials}</AvatarFallback>
    </Avatar>
  ) : (
    <div className="flex items-center gap-2 px-2">
      <User className="size-5 text-white/80" />
      <span className="hidden sm:inline text-sm text-white/80">Guest</span>
    </div>
  );

  return (
    <DropdownMenu modal={false}>
      {/* ✅ always a single button wrapper, identical SSR/CSR */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 hover:bg-white/10 transition"
          aria-label="Account"
        >
          {/* {!shouldBlock && session?.user && (
            <span className="absolute -top-1 -left-1 rounded-full bg-white p-1 shadow">
              <Crown className="size-3 text-yellow-500 fill-yellow-500" />
            </span>
          )} */}
          {status === 'loading' ? (
            <span className="h-10 w-10 grid place-items-center">
              <Loader className="size-4 animate-spin text-white/60" />
            </span>
          ) : (
            triggerContent
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
  align="end"
  sideOffset={12}
  alignOffset={-4}
  className={[
    // container
    'w-72 p-0 overflow-hidden rounded-2xl',
    'border border-white/10 bg-white/[0.05] backdrop-blur-xl',
    'shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-white/5',
    // nice open/close motion (shadcn/radix data attrs)
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  ].join(' ')}
>
  {/* arrow */}
  <div
    aria-hidden
    className="pointer-events-none absolute -top-2 right-6 h-4 w-4 rotate-45
               border-t border-l border-white/10 bg-white/[0.05] backdrop-blur-xl"
  />

  {/* header */}
  <div className="px-4 py-3 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-indigo-500/10 border-b border-white/10">
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? 'User'} />
        <AvatarFallback className="bg-indigo-500 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white/90">
          {session?.user?.name ?? 'Guest'}
        </div>
        <div className="truncate text-[11px] text-white/55">
          {session?.user?.email ?? 'Not signed in'}
        </div>
      </div>
    </div>
  </div>

  {/* items */}
  <div className="py-1">
    {session?.user ? (
      <>
        {/* <DropdownMenuItem
          onClick={onBilling}
          disabled={billing.isPending}
          className="group h-10 cursor-pointer rounded-lg px-3 mx-2 text-sm
                     text-white/90 focus:bg-white/10 hover:bg-white/10
                     focus:text-white transition"
        >
          <CreditCard className="mr-2 size-4 text-white/60 group-hover:text-fuchsia-300" />
          <span className="flex-1">Billing</span>
          <kbd className="ml-3 text-[10px] text-white/40">⌘B</kbd>
        </DropdownMenuItem> */}
        <div className="my-1 mx-2 h-px bg-white/10" />
<DropdownMenuItem
          onClick={() => router.push(`/dashboard/`)}
          // onClick={() => console.log(session.user)}
          className="group h-10 cursor-pointer rounded-lg px-3 mx-2 text-sm
                     text-rose-200/90 hover:bg-rose-500/10 focus:bg-rose-500/10
                     focus:text-rose-100 transition"
        >

          Dashboard
        </DropdownMenuItem>

        <div className="my-1 mx-2 h-px bg-white/10" />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="group h-10 cursor-pointer rounded-lg px-3 mx-2 text-sm
                     text-rose-200/90 hover:bg-rose-500/10 focus:bg-rose-500/10
                     focus:text-rose-100 transition"
        >
          <LogOut className="mr-2 size-4 text-rose-300/90" />
          Logout
        </DropdownMenuItem>
      </>
    ) : (
      <>
        <div className="px-4 py-2">
          <p className="text-[12px] text-white/70">
            You’re browsing as a guest. Sign in to save projects and sync across devices.
          </p>
        </div>
        <div className="px-3 pb-3">
          <button
            onClick={login}
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500
                       px-4 py-2 text-sm font-medium text-white shadow hover:shadow-md"
          >
            Sign in
          </button>
        </div>
      </>
    )}
  </div>
</DropdownMenuContent>

    </DropdownMenu>
  );
};
