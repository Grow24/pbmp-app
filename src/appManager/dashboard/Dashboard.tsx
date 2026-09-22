import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { Link, Title, useGetList } from "react-admin";

const StatCard = ({
  title,
  resource,
  to,
}: {
  title: string;
  resource: string;
  to: string;
}) => {
  const { total, isPending } = useGetList(resource, {
    pagination: { page: 1, perPage: 1 },
    sort: { field: "id", order: "ASC" },
    filter: {},
  });

  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">{isPending ? "…" : (total ?? 0)}</Typography>
        </CardContent>
      </Card>
    </Link>
  );
};

export const Dashboard = () => (
  <>
    <Title title="Dashboard" />
    <Card sx={{ mb: 3 }}>
      <CardHeader title="Welcome to App Manager" />
      <CardContent>
        Admin UI for JSONPlaceholder resources. Create and edit look instant
        because react-admin uses optimistic rendering, but JSONPlaceholder does
        not persist writes.
      </CardContent>
    </Card>
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "1fr 1fr 1fr",
        },
      }}
    >
      <StatCard title="Users" resource="users" to="/users" />
      <StatCard title="Posts" resource="posts" to="/posts" />
      <StatCard title="Comments" resource="comments" to="/comments" />
      <StatCard title="Todos" resource="todos" to="/todos" />
      <StatCard title="Albums" resource="albums" to="/albums" />
      <StatCard title="Photos" resource="photos" to="/photos" />
    </Box>
  </>
);
