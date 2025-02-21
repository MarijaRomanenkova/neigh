import Image from "next/image";
import loader from "@/public/assets/loader.gif";


const Loading = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Image src={loader} alt="Loading" width={150} height={150} />
    </div>
  );
};

export default Loading; 
