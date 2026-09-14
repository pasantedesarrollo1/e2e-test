import { test as setup } from "@playwright/test";
import { authenticateByRole } from "./common-setup.js";

setup("authenticate restaurant", authenticateByRole("restaurant"));
