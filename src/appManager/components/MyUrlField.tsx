import LaunchIcon from "@mui/icons-material/Launch";
import { Link } from "@mui/material";
import { useRecordContext } from "react-admin";

export const MyUrlField = ({ source }: { source: string }) => {
  const record = useRecordContext();
  if (!record) return null;

  const value = String(record[source] ?? "");
  const href = value.startsWith("http") ? value : `https://${value}`;

  return (
    <Link
      href={href}
      sx={{ textDecoration: "none" }}
      onClick={(event) => event.stopPropagation()}
    >
      {value}
      <LaunchIcon sx={{ fontSize: 15, ml: 1 }} />
    </Link>
  );
};

export default MyUrlField;
