import { APP_NAME } from "@/lib/constants";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer>
      <div className="wrapper">
        <div className="p-5 flex-center">
          {currentYear} &copy; {APP_NAME}. All Rights Reserved.
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;

