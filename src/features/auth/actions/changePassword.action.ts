'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { throwIfBackendUnavailable } from '@/lib/api/backend-connection-error';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

function extractBackendErrorMessage(errorData: any, fallback: string): string {
  if (Array.isArray(errorData?.message)) {
    return errorData.message.filter(Boolean).join(', ') || fallback;
  }

  if (typeof errorData?.message === 'string' && errorData.message.trim().length > 0) {
    return errorData.message;
  }

  if (typeof errorData?.error === 'string' && errorData.error.trim().length > 0) {
    return errorData.error;
  }

  return fallback;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResult> {
  try {
    if (payload.newPassword !== payload.confirmPassword) {
      return {
        success: false,
        error: 'La confirmación de contraseña no coincide',
      };
    }

    const session = await getServerSession(authOptions);
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      return {
        success: false,
        error: 'Sesión no válida. Vuelve a iniciar sesión.',
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: extractBackendErrorMessage(
          errorData,
          `No fue posible actualizar la contraseña (${response.status})`,
        ),
      };
    }

    const responseData = await response.json().catch(() => ({}));
    const message =
      responseData?.data?.message ||
      responseData?.message ||
      'Contraseña actualizada correctamente';

    return {
      success: true,
      message,
    };
  } catch (error) {
    throwIfBackendUnavailable(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la contraseña',
    };
  }
}
