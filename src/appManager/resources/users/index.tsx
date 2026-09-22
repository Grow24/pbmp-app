import GroupIcon from "@mui/icons-material/Group";
import { useMediaQuery, type Theme } from "@mui/material";
import {
  DataTable,
  Edit,
  EmailField,
  List,
  ReferenceManyField,
  required,
  Show,
  SimpleForm,
  SimpleList,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";
import MyUrlField from "../../components/MyUrlField";

const userFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export const UserList = () => {
  const isSmall = useMediaQuery<Theme>((theme) => theme.breakpoints.down("sm"));

  return (
    <List filters={userFilters}>
      {isSmall ? (
        <SimpleList
          primaryText={(record) => record.name}
          secondaryText={(record) => record.username}
          tertiaryText={(record) => record.email}
          linkType="show"
        />
      ) : (
        <DataTable rowClick="show">
          <DataTable.Col source="id" />
          <DataTable.Col source="name" />
          <DataTable.Col source="email">
            <EmailField source="email" />
          </DataTable.Col>
          <DataTable.Col source="phone" />
          <DataTable.Col source="website" field={MyUrlField} />
          <DataTable.Col source="company.name" />
        </DataTable>
      )}
    </List>
  );
};

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" validate={required()} />
      <TextInput source="username" validate={required()} />
      <TextInput source="email" validate={required()} />
      <TextInput source="phone" />
      <TextInput source="website" />
      <TextInput source="address.street" />
      <TextInput source="address.city" />
      <TextInput source="company.name" />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="phone" />
      <MyUrlField source="website" />
      <TextField source="address.street" />
      <TextField source="address.city" />
      <TextField source="company.name" />
      <ReferenceManyField label="Posts" reference="posts" target="userId">
        <DataTable>
          <DataTable.Col source="id" />
          <DataTable.Col source="title" />
        </DataTable>
      </ReferenceManyField>
      <ReferenceManyField label="Todos" reference="todos" target="userId">
        <DataTable>
          <DataTable.Col source="id" />
          <DataTable.Col source="title" />
          <DataTable.Col source="completed" />
        </DataTable>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);

export default {
  list: UserList,
  edit: UserEdit,
  show: UserShow,
  icon: GroupIcon,
  recordRepresentation: "name",
};
