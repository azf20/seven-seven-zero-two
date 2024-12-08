"use client";

import type { NextPage } from "next";
import Link from "next/link";
import { EIP7702Greeter } from "~~/components/eip-7702/EIP7702Greeter";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-4xl font-bold text-center mb-2">EIP-7702 Examples</h1>
        <div className="flex justify-center">
          <div className="flex gap-8">
            <div className="flex flex-col items-center text-center">
              <Link 
                href="/greeter" 
                className="px-4 py-2 text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Greeter
              </Link>
              <p className="mt-2 text-sm text-gray-600">
                Interact with the Greeter smart contract
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <Link 
                href="/batches"
                className="px-4 py-2 text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Batches
              </Link>
              <p className="mt-2 text-sm text-gray-600">
                View and manage transaction batches
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;