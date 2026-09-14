import { test as setup } from "@playwright/test";
import { authenticateByRole } from "./common-setup.js";

setup("authenticate retail", authenticateByRole("retail"));
