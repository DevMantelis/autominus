"use client";

import { Button } from "@heroui/button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { cn } from "@heroui/theme";
import { useState } from "react";
import { MenuItems } from "./menuItems";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { useSelectedLayoutSegments } from "next/navigation";
import { Chip } from "@heroui/chip";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const segments = useSelectedLayoutSegments();
  const currentPath = "/" + segments.join("/");

  const isActive = (href: string) => {
    if (currentPath == href) return true;

    return false;
  };

  return (
    <Navbar
      classNames={{
        base: cn("border-default-100 border-b mb-10", {
          "bg-default-200/50 dark:bg-default-100/50": isMenuOpen,
        }),
        wrapper: "w-full justify-center",
        item: "hidden md:flex",
      }}
      height="60px"
      isMenuOpen={isMenuOpen}
      maxWidth="full"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarMenuToggle className="text-default-400 md:hidden" />

      <NavbarMenu className="bg-default-200/50 shadow-medium dark:bg-default-100/50 top-[calc(var(--navbar-height)-1px)] max-h-fit pt-6 pb-6 backdrop-blur-md backdrop-saturate-150">
        <NavbarMenuItem>
          <Button fullWidth as={Link} href="/#" variant="faded">
            Sign In
          </Button>
        </NavbarMenuItem>
        <NavbarMenuItem className="mb-4">
          <Button
            fullWidth
            as={Link}
            className="bg-foreground text-background"
            href="/#"
          >
            Get Started
          </Button>
        </NavbarMenuItem>
        {MenuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.href}-${index}`}>
            <Link
              className="text-default-500 mb-2 w-full"
              href={item.href}
              size="md"
            >
              {item.text}
            </Link>
            {index < MenuItems.length - 1 && <Divider className="opacity-50" />}
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <NavbarBrand>
        {/* <div className=" p-1.5 rounded-full">
          <CarIcon size={34} />
        </div> */}
        <span className="text-large ml-2 font-medium">AUTOMINUS</span>
        <Chip
          size="sm"
          color="primary"
          classNames={{
            base: "ml-2",
            content: "font-medium",
          }}
        >
          BETA
        </Chip>
      </NavbarBrand>

      {/* Center Content */}
      <NavbarContent justify="center" className="gap-5">
        {MenuItems.map((item) => {
          return (
            <NavbarItem key={item.href} isActive={isActive(item.href)}>
              <Link
                className={cn(
                  "text-foreground hover:underline hover:underline-offset-4",
                  {
                    "font-bold text-primary": isActive(item.href),
                  }
                )}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                size="sm"
              >
                {item.text}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      {/* Right Content */}
      <NavbarContent className="flex" justify="end">
        <NavbarItem className="ml-2 flex gap-2">
          <Button
            className="font-medium"
            color="primary"
            radius="md"
            variant="shadow"
          >
            Login
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
