import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  BooleanField,
  BooleanInput,
  Create,
  DataTable,
  Edit,
  EditButton,
  List,
  ReferenceField,
  ReferenceInput,
  required,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
} from "react-admin";

const todoFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <ReferenceInput
    key="userId"
    source="userId"
    label="User"
    reference="users"
  />,
  <BooleanInput key="completed" source="completed" />,
];

export const TodoList = () => (
  <List filters={todoFilters}>
    <DataTable rowClick="show">
      <DataTable.Col source="id" />
      <DataTable.Col source="userId">
        <ReferenceField source="userId" reference="users" link="show" />
      </DataTable.Col>
      <DataTable.Col source="title" />
      <DataTable.Col source="completed" field={BooleanField} />
      <DataTable.Col>
        <EditButton />
      </DataTable.Col>
      <DataTable.Col>
        <ShowButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const TodoEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
      <BooleanInput source="completed" />
    </SimpleForm>
  </Edit>
);

export const TodoCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
      <BooleanInput source="completed" />
    </SimpleForm>
  </Create>
);

export const TodoShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="userId" reference="users" link="show" />
      <TextField source="title" />
      <BooleanField source="completed" />
    </SimpleShowLayout>
  </Show>
);

export default {
  list: TodoList,
  edit: TodoEdit,
  create: TodoCreate,
  show: TodoShow,
  icon: CheckCircleIcon,
  recordRepresentation: "title",
};
