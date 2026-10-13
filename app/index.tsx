import { Redirect } from "expo-router";
import { GUEST_MAP_ENTRY_HREF } from "../lib/appLaunchRouting";

export default function RootIndex() {
  return <Redirect href={GUEST_MAP_ENTRY_HREF} />;
}
