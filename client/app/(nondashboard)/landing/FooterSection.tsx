import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="border-t border-gray-200 py-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4">
            <Link href={"/"} className="text-xl font-bold" scroll={false}>
              HOME
              <span className="text-secondary-500 font-light hover:text-primary-300!">
                SCOUT
              </span>
            </Link>
          </div>

          <nav className="mb-4">
            <ul className="flex space-x-6">
              <li>
                <Link href={"/about"}>About Us</Link>
              </li>
              <li>
                <Link href={"/contact"}>Contact Us</Link>
              </li>
              <li>
                <Link href={"/faq"}>FAQ</Link>
              </li>
              <li>
                <Link href={"/terms"}>Terms</Link>
              </li>
              <li>
                <Link href={"/privacy"}>Privacy</Link>
              </li>
            </ul>
          </nav>
          <div className="flex space-x-4 mb-4">
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
            </Link>
            <Link
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faYoutube} className="h-6 w-6" />
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 flex justify-center space-x-4">
          <span>
            &copy; {new Date().getFullYear()} HOMESCOUT. All rights reserved.
          </span>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookie">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
