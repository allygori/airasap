import * as Dialog from "@/app/components/basic/dialog";
import Modal from "@/app/components/basic/modal/modal";

type Props = {
  className?: string;
};

const test = ({ className = "" }: Props) => {
  return (
    <section className={className}>
      <p>TEST</p>
      <Modal />
      {/* <Dialog.Root>
        <Dialog.Trigger>TRIGGER</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <p>Dialog Content</p>
        </Dialog.Content>
      </Dialog.Root> */}
    </section>
  );
};

export default test;

// <Dialog.Root>
//   <Dialog.Trigger>
//     <Button>Edit profile</Button>
//   </Dialog.Trigger>

//   <Dialog.Content maxWidth="450px">
//     <Dialog.Title>Edit profile</Dialog.Title>
//     <Dialog.Description size="2" mb="4">
//       Make changes to your profile.
//     </Dialog.Description>

//     <Flex direction="column" gap="3">
//       <label>
//         <Text as="div" size="2" mb="1" weight="bold">
//           Name
//         </Text>
//         <TextField.Root
//           defaultValue="Freja Johnsen"
//           placeholder="Enter your full name"
//         />
//       </label>
//       <label>
//         <Text as="div" size="2" mb="1" weight="bold">
//           Email
//         </Text>
//         <TextField.Root
//           defaultValue="freja@example.com"
//           placeholder="Enter your email"
//         />
//       </label>
//     </Flex>

//     <Flex gap="3" mt="4" justify="end">
//       <Dialog.Close>
//         <Button variant="soft" color="gray">
//           Cancel
//         </Button>
//       </Dialog.Close>
//       <Dialog.Close>
//         <Button>Save</Button>
//       </Dialog.Close>
//     </Flex>
//   </Dialog.Content>
// </Dialog.Root>
