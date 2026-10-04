import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/auth', () => ({
  signIn: vi.fn(() => Promise.resolve({})),
  signUp: vi.fn(() => Promise.resolve({ session: null })),
}));

import { signIn, signUp } from '../lib/auth';
import LoginPage from './LoginPage';

beforeEach(() => vi.clearAllMocks());

describe('LoginPage', () => {
  it('показывает ошибку валидации на пустой e-mail и не дёргает auth', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Введите e-mail')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('отклоняет e-mail без @', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'not-an-email');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Некорректный e-mail')).toBeInTheDocument();
  });

  it('на успешный вход вызывает signIn с нормализованным e-mail', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/e-mail/i), '  USER@MAIL.RU ');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('user@mail.ru', 'secret123'));
  });

  it('переводит "Invalid login credentials" на русский', async () => {
    (signIn as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Invalid login credentials'),
    );
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'user@mail.ru');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный e-mail или пароль');
  });

  it('после регистрации без сессии предлагает подтвердить почту', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /нет аккаунта/i }));
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'new@mail.ru');
    await userEvent.type(screen.getByLabelText(/пароль/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/подтвердите регистрацию/i);
    expect(signUp).toHaveBeenCalledWith('new@mail.ru', 'secret123');
  });
});
