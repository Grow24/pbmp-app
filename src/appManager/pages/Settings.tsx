import {
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Title } from "react-admin";

export const Settings = () => (
  <Card>
    <Title title="Settings" />
    <CardHeader title="Application settings" />
    <CardContent>
      <List>
        <ListItem>
          <ListItemText
            primary="API"
            secondary={import.meta.env.VITE_JSON_SERVER_URL || "https://jsonplaceholder.typicode.com"}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Auth"
            secondary="Local users: janedoe / password (admin) and johndoe / password (user)"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Persistence"
            secondary="JSONPlaceholder accepts POST/PUT/DELETE but does not save changes."
          />
        </ListItem>
      </List>
    </CardContent>
  </Card>
);
