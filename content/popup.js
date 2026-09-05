document.addEventListener("DOMContentLoaded", () => {
    const raidList = document.getElementById("raid-list")
    const clearBtn = document.getElementById("clear-btn")

    function loadRaids() {
        chrome.storage.local.get(["raids"], (result) => {
            const raids = result.raids || [];
            if (raids.length === 0) {
                raidList.innerHTML = "No raids tracked yet. Watch some streams and raid somebody!"
                return;
            }

            raidList.innerHTML = "";
            raids.reverse().forEach(raid => {
                const div = document.createElement("div");
                div.className = "raid-item";
                div.innerHTML = `
                    <div>
                        <span class="source">${raid.source}</span> -> <span class="target">${raid.target}</span>
                    </div>                
                    <div class="time">${raid.timestamp}</div>
                `;
                raidList.appendChild(div);
            });
        });
    }

    clearBtn.addEventListener("click", () => {
        chrome.storage.local.set({raids: []}, () => {
            loadRaids();
        });
    });

    loadRaids();
});