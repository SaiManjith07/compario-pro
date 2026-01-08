'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export function ChangePasswordForm() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const isPasswordProvider =
    user?.providerData.some((p) => p.providerId === 'password') ?? false;

  const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    if (!user || !user.email) return;

    setIsPending(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        values.currentPassword
      );

      // Re-authenticate the user to confirm their identity
      await reauthenticateWithCredential(user, credential);

      // If re-authentication is successful, update the password
      await updatePassword(user, values.newPassword);

      toast({
        title: 'Success!',
        description: 'Your password has been updated successfully.',
      });
      form.reset();
    } catch (error: any) {
      console.error(error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/wrong-password') {
        description = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Too many attempts. Please try again later.';
      }
      toast({
        variant: 'destructive',
        title: 'Error Updating Password',
        description,
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!isPasswordProvider) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Google Account</AlertTitle>
        <AlertDescription>
          You are signed in with a Google account. To change your password, please
          manage it through your Google settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change Password
        </Button>
      </form>
    </Form>
  );
}
