import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { SettingsIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center my-20 gap-5">
      <div className="flex gap-2">
        <SettingsIcon className="animate-spin" />
        <p>In Development</p>
        <SettingsIcon className="animate-spin" />
      </div>
      <div className="flex gap-2 items-center">
        <p>Checkout</p>
        <Link href="/listings">
          {/* <Button color="primary" variant="bordered" size="sm"> */}
          /listings
          {/* </Button> */}
        </Link>
      </div>
    </div>
  );
}
