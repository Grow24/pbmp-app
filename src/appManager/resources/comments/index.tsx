import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import {
  Create,
  DataTable,
  Edit,
  EditButton,
  EmailField,
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

const commentFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <ReferenceInput
    key="postId"
    source="postId"
    label="Post"
    reference="posts"
  />,
];

export const CommentList = () => (
  <List filters={commentFilters}>
    <DataTable rowClick="show">
      <DataTable.Col source="id" />
      <DataTable.Col source="postId">
        <ReferenceField source="postId" reference="posts" link="show" />
      </DataTable.Col>
      <DataTable.Col source="name" />
      <DataTable.Col source="email">
        <EmailField source="email" />
      </DataTable.Col>
      <DataTable.Col>
        <EditButton />
      </DataTable.Col>
      <DataTable.Col>
        <ShowButton />
      </DataTable.Col>
    </DataTable>
  </List>
);

export const CommentEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="postId" reference="posts" />
      <TextInput source="name" validate={required()} />
      <TextInput source="email" validate={required()} />
      <TextInput source="body" multiline rows={4} validate={required()} />
    </SimpleForm>
  </Edit>
);

export const CommentCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="postId" reference="posts" />
      <TextInput source="name" validate={required()} />
      <TextInput source="email" validate={required()} />
      <TextInput source="body" multiline rows={4} validate={required()} />
    </SimpleForm>
  </Create>
);

export const CommentShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="postId" reference="posts" link="show" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="body" />
    </SimpleShowLayout>
  </Show>
);

export default {
  list: CommentList,
  edit: CommentEdit,
  create: CommentCreate,
  show: CommentShow,
  icon: ChatBubbleIcon,
  recordRepresentation: "name",
};
