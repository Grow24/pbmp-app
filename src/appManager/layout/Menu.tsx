import SettingsIcon from "@mui/icons-material/Settings";
import { Menu } from "react-admin";

export const AppMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <Menu.Item
      to="/settings"
      primaryText="Settings"
      leftIcon={<SettingsIcon />}
    />
  </Menu>
);
