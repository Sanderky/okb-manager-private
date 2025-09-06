import { default as LogoIcon } from '@mui/icons-material/TokenOutlined';

export default function SitemarkIcon() {
  return (
    <h1 className="text-dark inline-flex flex-row items-center justify-center font-medium">
      <LogoIcon className="text-3xl" />
      <div>
        <span className="text-darkYellow text-3xl text-shadow-sm/20">
          OKB
        </span>
        <span className="text-xl underline">manager</span>
      </div>
    </h1>
  );
}
