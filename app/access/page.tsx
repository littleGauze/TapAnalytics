'use client';

import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function AccessPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || '登录失败');
        return;
      }
      window.location.replace('/');
    } catch {
      setError('连接失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400, p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={2}>
          TAPANALYTICS
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>登录数据中心</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          请输入账号和密码以查看收益数据。
        </Typography>
        <Stack component="form" onSubmit={submit} spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="账号"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            label="密码"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={busy || !username || !password}>
            {busy ? '正在验证…' : '登录'}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
