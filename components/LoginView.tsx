'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export function LoginView() {
  const router = useRouter();
  const search = useSearchParams();
  const addMode = search.get('mode') === 'add';
  const [cookie, setCookie] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie, mode: addMode ? 'add' : 'login' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || '登录失败');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: { xs: 'stretch', sm: 'center' },
        p: { xs: 0, sm: 3 },
        position: 'relative',
      }}
    >
      <div className="grain" />
      <Card
        sx={{
          width: '100%',
          maxWidth: 560,
          mx: 'auto',
          p: { xs: 2.5, sm: 4 },
          borderRadius: { xs: 0, sm: 4 },
          minHeight: { xs: '100dvh', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-end', sm: 'center' },
          pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', sm: 4 },
        }}
      >
        <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={2}>
          TAPANALYTICS
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
          {addMode ? '接入其他账号' : '连接开发者账号'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          网页无法像桌面端那样弹出 TapTap 登录窗。请先在浏览器登录开发者中心，再把 Cookie 粘贴到这里，由本机 Next.js 服务代为请求数据。
        </Typography>

        <Stack spacing={1.2} sx={{ mb: 2 }}>
          <Typography variant="body2">1. 打开 <Link href="https://developer.taptap.cn/" target="_blank">developer.taptap.cn</Link> 并完成登录</Typography>
          <Typography variant="body2">2. 开发者工具 → Network，点任意 `/api/` 请求</Typography>
          <Typography variant="body2">3. 复制 Request Headers 里的 `Cookie` 整行，粘贴下方</Typography>
        </Stack>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <TextField
          multiline
          minRows={5}
          fullWidth
          placeholder="sessionid=...; ... "
          value={cookie}
          onChange={(e) => setCookie(e.target.value)}
        />
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={busy || !cookie.trim()}
          onClick={submit}
          sx={{ mt: 2, py: 1.3 }}
        >
          {busy ? '正在校验…' : addMode ? '添加并返回' : '开始同步数据'}
        </Button>
        {addMode ? (
          <Button sx={{ mt: 1 }} onClick={() => router.push('/')}>
            取消
          </Button>
        ) : null}
      </Card>
    </Box>
  );
}
