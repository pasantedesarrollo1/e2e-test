import { test as setup } from "@playwright/test";
import { authenticateByRole } from "./common-setup.js";

setup("authenticate dispatch", authenticateByRole("dispatch"));
