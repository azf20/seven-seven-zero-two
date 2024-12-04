"use client";

import type { NextPage } from "next";
import { EIP7702Greeter } from "~~/components/eip-7702/EIP7702Greeter";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-4xl font-bold text-center mb-2">EIP-7702 Greeter</h1>
        <h2 className="text-xl text-center text-neutral-500">A custom greeting in your burner account</h2>
        <EIP7702Greeter />
      </div>
    </div>
  );
};

export default Home;