import ListingsStats from "./listingsStats";

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ListingsStats />
      {children}
    </>
  );
}
