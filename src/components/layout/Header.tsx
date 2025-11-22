import Link from 'next/link';
import { FileText, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth } from '@/lib/api';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Header() {
  const user = await getCurrentUser();

  async function logout() {
    'use server';
    try {
      await auth.logout();
    } catch (error) {
      // Ignore errors (e.g. 401 if already logged out)
      console.log('Logout failed (likely already logged out):', error);
    }
    redirect('/login');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline sm:inline-block">
              QuickMoM
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden md:inline-block">
                Hello, {user.username}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/meetings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Meeting
                </Link>
              </Button>
              <form action={logout}>
                <Button variant="ghost" size="sm">Logout</Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
