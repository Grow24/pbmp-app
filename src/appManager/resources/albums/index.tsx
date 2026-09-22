import PhotoAlbumIcon from "@mui/icons-material/PhotoAlbum";
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
} from "react-admin";

const albumFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <ReferenceInput
    key="userId"
    source="userId"
    label="User"
    reference="users"
  />,
];

export const AlbumList = () => (
  <List filters={albumFilters}>
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

export const AlbumEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
    </SimpleForm>
  </Edit>
);

export const AlbumCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="userId" reference="users" />
      <TextInput source="title" validate={required()} />
    </SimpleForm>
  </Create>
);

export const AlbumShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="userId" reference="users" link="show" />
      <TextField source="title" />
      <ReferenceManyField label="Photos" reference="photos" target="albumId">
        <DataTable>
          <DataTable.Col source="id" />
          <DataTable.Col source="title" />
          <DataTable.Col source="thumbnailUrl" />
        </DataTable>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);

export default {
  list: AlbumList,
  edit: AlbumEdit,
  create: AlbumCreate,
  show: AlbumShow,
  icon: PhotoAlbumIcon,
  recordRepresentation: "title",
};
