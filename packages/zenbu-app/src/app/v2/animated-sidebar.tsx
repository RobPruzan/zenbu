import { AnimatePresence, motion } from "framer-motion";

export const AnimatedSidebar = <T,>({
  // children,
  renderSidebarContent,
  width, 
  data
}: {
  renderSidebarContent:(data: T) => React.ReactNode;
  width: string | number;
  data: T | undefined | null
  }) => {

  return (
    <AnimatePresence>
      {data && <motion.div
        className="h-full"
        initial={{
          width: 0,
          opacity: 0,
          marginRight: 0,
        }}
        animate={{
          width,
          opacity: 1,
          transition: {
            width: {
              type: "spring",
              bounce: 0.1,
              duration: 0.2,
            },
            opacity: { duration: 0.1, delay: 0.05 },
          },
        }}
        exit={{
          width: 0,
          opacity: 0,
          transition: {
            width: {
              type: "spring",
              bounce: 0.1,
              duration: 0.2,
            },
            opacity: { duration: 0.1 },
          },
        }}
      >
        {renderSidebarContent(data)}
      </motion.div>}
      
    </AnimatePresence>
  );
};
