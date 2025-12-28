import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
  InlineStack,
  ExceptionList,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";

// Hardcoded Plan Constants for Client-Side Use
// We duplicate these here to avoid importing server-side code (shopify.server.ts) into the client bundle
const PLAN_BASIC = 'Basic';
const PLAN_STANDARD = 'Standard';
const PLAN_PRO = 'Pro';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  
  try {
    const billingCheck = await billing.check();
    return { 
      currentPlans: billingCheck.appSubscriptions,
    };
  } catch (e) {
    return { currentPlans: [] };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const plan = formData.get("plan") as string;

  if (plan) {
    await billing.request({
      plan,
      isTest: process.env.NODE_ENV !== "production",
      returnUrl: `https://${shop}/admin/apps/cross-border-agent/app`,
    });
  }

  return null;
};

export default function PlansPage() {
  const { currentPlans } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const isUpgrading = navigation.state === "submitting";

  const handleUpgrade = (plan: string) => {
    submit({ plan }, { method: "post" });
  };

  const plans = [
    {
      name: PLAN_BASIC,
      price: "$9.90",
      features: ["200 Product Syncs", "Core Localization AI", "Standard Support"],
    },
    {
      name: PLAN_STANDARD,
      price: "$29.90",
      features: [
        "1,000 Product Syncs",
        "Market-Specific Personas",
        "Priority Support",
      ],
    },
    {
      name: PLAN_PRO,
      price: "$69.90",
      features: [
        "10,000 Product Syncs",
        "Bulk Multi-Market Update",
        "Real-time AI Streaming",
        "Dedicated Account Manager",
      ],
    },
  ];

  return (
    <Page title="Select a Plan">
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" align="center">
            {plans.map((plan) => (
              <Box key={plan.name} minWidth="300px" maxWidth="300px">
                <Card>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">
                        {plan.name}
                      </Text>
                      <Text as="p" variant="heading2xl" fontWeight="bold">
                        {plan.price}
                        <Text as="span" variant="bodyMd" fontWeight="regular">
                          /month
                        </Text>
                      </Text>
                    </BlockStack>
                    
                    <BlockStack gap="100">
                      {plan.features.map((feature) => (
                        <ExceptionList
                          key={feature}
                          items={[
                            {
                              icon: CheckIcon,
                              description: feature,
                            },
                          ]}
                        />
                      ))}
                    </BlockStack>

                    <Button
                      variant="primary"
                      fullWidth
                      loading={isUpgrading}
                      disabled={currentPlans.some(sub => sub.name === plan.name)}
                      onClick={() => handleUpgrade(plan.name)}
                    >
                      {currentPlans.some(sub => sub.name === plan.name) ? "Current Plan" : "Upgrade"}
                    </Button>
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

