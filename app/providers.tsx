"use client";

import { useEffect, useState } from "react";
import {
  MantineProvider,
  AppShell,
  Group,
  Text,
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import { IconMaximize, IconMinimize, IconSun, IconMoon } from "@tabler/icons-react";
import BottomNav from "@/components/BottomNav";

function Header() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Text fw={600} size="sm">Grill Tracker</Text>
      <Group gap={4}>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={toggleColorScheme}
          aria-label="Toggle color scheme"
        >
          {colorScheme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
        </ActionIcon>
      </Group>
    </Group>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/view";

  return (
    <MantineProvider>
      <Notifications position="top-center" />
      <AppShell
        header={{ height: 48 }}
        footer={showNav ? { height: 62 } : undefined}
        padding="md"
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        <AppShell.Main>{children}</AppShell.Main>
        {showNav && (
          <AppShell.Footer>
            <BottomNav />
          </AppShell.Footer>
        )}
      </AppShell>
    </MantineProvider>
  );
}
