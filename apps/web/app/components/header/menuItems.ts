export type MenuItem = {
  text: string;
  href: string;
};

export const MenuItems: MenuItem[] = [
  { text: "Home", href: "/" },
  { text: "Listings", href: "/listings" },
  { text: "Blog", href: "/blog" },
  { text: "Customers", href: "/customers" },
];
