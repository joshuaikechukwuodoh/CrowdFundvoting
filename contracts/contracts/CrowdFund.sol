// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CrowdFund {

    // ======================
    // 1. DATA STRUCTURE
    // ======================

    // This is like a form that stores information about one campaign
    struct Campaign {
        address creator;        // Who created the campaign
        uint256 goal;           // How much money they want to raise (in wei)
        uint256 deadline;       // When the campaign ends (timestamp)
        uint256 amountRaised;   // How much money has been raised so far
        bool claimed;           // Has the creator already taken the money?
        string title;           // Name of the campaign
    }

    uint256 public campaignCount; // Total number of campaigns created

    // Stores all campaigns using an ID (0, 1, 2, 3...)
    mapping(uint256 => Campaign) public campaigns;

    // Stores how much each person donated to each campaign
    // Example: contributions[0][0x123...] = 1 ether
    mapping(uint256 => mapping(address => uint256)) public contributions;

    // ======================
    // 2. EVENTS
    // ======================
    // Events are like notifications that something happened

    event CampaignCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 goal,
        uint256 deadline,
        string title
    );

    event Contributed(
        uint256 indexed id,
        address indexed contributor,
        uint256 amount
    );

    event Claimed(uint256 indexed id, uint256 amount);
    event Refunded(uint256 indexed id, address indexed contributor, uint256 amount);

    // ======================
    // 3. FUNCTIONS
    // ======================

    // CREATE A NEW CAMPAIGN
    // Anyone can call this function to start a fundraising campaign
    function createCampaign(
        uint256 _goal,              // How much they want to raise
        uint256 _durationInDays,    // How many days the campaign will last
        string calldata _title      // Title of the campaign
    ) external returns (uint256) {

        require(_goal > 0, "Goal must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

        uint256 id = campaignCount; // New campaign gets the next ID

        // Save the campaign information
        campaigns[id] = Campaign({
            creator: msg.sender,                                    // Who is creating it
            goal: _goal,
            deadline: block.timestamp + (_durationInDays * 1 days), // Current time + duration
            amountRaised: 0,
            claimed: false,
            title: _title
        });

        campaignCount++; // Increase the total number of campaigns

        // Send a notification that a new campaign was created
        emit CampaignCreated(id, msg.sender, _goal, campaigns[id].deadline, _title);

        return id; // Return the ID of the new campaign
    }

    // DONATE TO A CAMPAIGN
    // People call this function and send ETH to support a campaign
    function contribute(uint256 _id) external payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Must send ETH");

        // Add the donation to the total raised
        campaign.amountRaised += msg.value;

        // Remember how much this person donated
        contributions[_id][msg.sender] += msg.value;

        // Send a notification
        emit Contributed(_id, msg.sender, msg.value);
    }

    // CREATOR TAKES THE MONEY (only if successful)
    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];

        require(msg.sender == campaign.creator, "Only creator");
        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(campaign.amountRaised >= campaign.goal, "Goal not reached");
        require(!campaign.claimed, "Already claimed");

        campaign.claimed = true; // Mark as claimed so it can't be claimed again
        uint256 amount = campaign.amountRaised;

        // Send all the money to the creator
        (bool sent, ) = campaign.creator.call{value: amount}("");
        require(sent, "Failed to send ETH");

        emit Claimed(_id, amount);
    }

    // GET YOUR MONEY BACK (only if campaign failed)
    function refund(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(campaign.amountRaised < campaign.goal, "Goal was reached");

        uint256 amount = contributions[_id][msg.sender];
        require(amount > 0, "No contribution");

        // Set their contribution to 0 so they can't refund twice
        contributions[_id][msg.sender] = 0;

        // Send their money back
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send ETH");

        emit Refunded(_id, msg.sender, amount);
    }

    // VIEW FUNCTIONS (just for reading information)

    // Get full details of a campaign
    function getCampaign(uint256 _id) external view returns (Campaign memory) {
        return campaigns[_id];
    }

    // Check how much a specific person donated to a campaign
    function getContribution(uint256 _id, address _user) external view returns (uint256) {
        return contributions[_id][_user];
    }
}