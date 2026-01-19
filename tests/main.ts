import {} from "../target/types/interact_dapp";
import {provider, program, setupEnvironment, depositEarn, withdrawEarn} from "./lending";
import { swapClmm } from "./clmm";

describe("lending", async () => {
    // it("set up environment" , async () => {
    //     await setupEnvironment();
    // })
    // it("deposit for lending", async () => {
    //     await depositEarn();
    // })
    // it("withdraw for lending", async () => {
    //     await withdrawEarn();
    // })
    it("swap", async () => {
        await swapClmm();
    })
    // it("test", async () => {
    //     await test();
    // })
})