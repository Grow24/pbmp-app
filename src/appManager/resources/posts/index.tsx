import BookIcon from "@mui/icons-material/Book";
import {
  Create,
  DataTable,
  Edit,
  EditButton,
  List,
  ReferenceField,
  ReferenceInput,
  ReferenceManyField,
  required,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  useRecordContext,
} from "react-admin";

const postFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <ReferenceInput
    key="userId"
    source="userId"
    label="User"
    reference="users"
  />,
];

export const PostList = () => (
  <List filters={postFilters}>
    <DataTable rowClick="show">
      <DataTable.Col source="id" />
      <DataTable.Col source="userId">
        <ReferenceField source="userId" reference="users" link="show" />
      </DataTable.Col>
      <DataTable.Col source="title" />
      <DataTable.Col>
        <EditButton />
      </DataTable.Col>
      <DataTable.Col>
        <ShowButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

const PostTitle = () => {
  const record = useRecordContext();
  return <span>Post {record ? `"${record.title}"` : ""}</span>;
};

export const PostEdit = () => (
  <Edit title={<PostTitle />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
      <TextInput source="body" multiline rows={5} validate={required()} />
    </SimpleForm>
  </Edit>
);

export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
      <TextInput source="body" multiline rows={5} validate={required()} />
    </SimpleForm>
  </Create>
);

export const PostShow = () => (
  <Show title={<PostTitle />}>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="userId" reference="users" link="show" />
      <TextField source="title" />
      <TextField source="body" />
      <ReferenceManyField label="Comments" reference="comments" target="postId">
        <DataTable>
          <DataTable.Col source="id" />
          <DataTable.Col source="name" />
          <DataTable.Col source="email" />
          <DataTable.Col source="body" />
        </DataTable>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);

export default {
  list: PostList,
  edit: PostEdit,
  create: PostCreate,
  show: PostShow,
  icon: BookIcon,
  recordRepresentation: "title",
};
