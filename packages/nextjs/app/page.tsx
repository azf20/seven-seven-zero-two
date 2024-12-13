"use client";

import Link from "next/link";
import type { NextPage } from "next";


const Home: NextPage = () => {
  return (
    <div className="flex flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-4xl font-bold text-center mb-2">EIP-7702 Examples</h1>
        <p className="text-center mb-4">
          <a 
            href="https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7702.md"
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            EIP
          </a>
          {" | "}
          <a
            href="https://ethereum-magicians.org/t/eip-set-eoa-account-code-for-one-transaction/19923"
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ethereum Magicians
          </a>
          {" | "}
          <a
            href="https://eip7702.io/ecosystem"
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Community site
          </a>
        </p>
        <div className="flex justify-center">
          <div className="flex gap-8">
            <div className="flex flex-col items-center text-center">
              <Link
                href="/greeter"
                className="px-4 py-2 text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Greeter
              </Link>
              <p className="mt-2 text-sm">Use a simple Greeter contract</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <Link
                href="/batches"
                className="px-4 py-2 text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Batches
              </Link>
              <p className="mt-2 text-sm">Batch transactions with EIP-7702</p>
            </div>
          </div>
        </div>
        <p className="text-center mt-8">
          <a
            href="https://github.com/azf20/seven-seven-zero-two"
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source code
          </a>
        </p>
      </div>
    </div>
  );
};

export default Home;