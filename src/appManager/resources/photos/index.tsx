import ImageIcon from "@mui/icons-material/Image";
import {
  Create,
  DataTable,
  Edit,
  EditButton,
  ImageField,
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
  UrlField,
} from "react-admin";

const photoFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <ReferenceInput
    key="albumId"
    source="albumId"
    label="Album"
    reference="albums"
  />,
];

export const PhotoList = () => (
  <List filters={photoFilters} perPage={25}>
    <DataTable rowClick="show">
      <DataTable.Col source="id" />
      <DataTable.Col source="albumId">
        <ReferenceField source="albumId" reference="albums" link="show" />
      </DataTable.Col>
      <DataTable.Col source="thumbnailUrl">
        <ImageField source="thumbnailUrl" title="title" />
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

export const PhotoEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <ReferenceInput source="albumId" reference="albums" />
      <TextInput source="title" validate={required()} />
      <TextInput source="url" />
      <TextInput source="thumbnailUrl" />
    </SimpleForm>
  </Edit>
);

export const PhotoCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="albumId" reference="albums" />
      <TextInput source="title" validate={required()} />
      <TextInput source="url" />
      <TextInput source="thumbnailUrl" />
    </SimpleForm>
  </Create>
);

export const PhotoShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <ReferenceField source="albumId" reference="albums" link="show" />
      <TextField source="title" />
      <ImageField source="url" title="title" />
      <UrlField source="url" />
    </SimpleShowLayout>
  </Show>
);

export default {
  list: PhotoList,
  edit: PhotoEdit,
  create: PhotoCreate,
  show: PhotoShow,
  icon: ImageIcon,
  recordRepresentation: "title",
};
